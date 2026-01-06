<?php
namespace App\Services;

use App\Models\BudgetCategory;
use App\Models\ProjectBudget;
use App\Models\ProjectExpense;

class BudgetService
{
    /**
     * Update budget calculations after expense approval
     */
    public function updateBudgetAfterApproval(ProjectExpense $expense): void
    {
        \Log::info('=== START: updateBudgetAfterApproval ===', [
            'expense_id'         => $expense->id,
            'project_id'         => $expense->project_id,
            'budget_category_id' => $expense->budget_category_id,
        ]);

        $expense->load(['project.projectBudget', 'budgetCategory']);

        // Debug: Check what we loaded
        \Log::info('After loading relationships', [
            'has_project'         => $expense->project ? true : false,
            'project_type'        => $expense->project ? get_class($expense->project) : null,
            'has_budget_relation' => $expense->project ? $expense->project->relationLoaded('budget') : false,
        ]);

        if ($expense->project) {
            $budget = $expense->project->projectBudget;
            \Log::info('Budget details', [
                'budget_exists'              => $budget ? true : false,
                'budget_type'                => gettype($budget),
                'budget_class'               => is_object($budget) ? get_class($budget) : null,
                'budget_value'               => $budget,
                'is_project_budget_instance' => $budget instanceof \App\Models\ProjectBudget,
            ]);

            if ($budget) {
                \Log::info('Budget properties', [
                    'budget_id'         => is_object($budget) && isset($budget->id) ? $budget->id : 'N/A',
                    'budget_attributes' => is_object($budget) ? $budget->getAttributes() : 'Not an object',
                ]);
            }
        }

        // Only update if relationships exist
        if ($expense->project && $expense->project->projectBudget) {
            \Log::info('Calling updateProjectBudget');
            $this->updateProjectBudget($expense);
        } else {
            \Log::info('Skipping updateProjectBudget', [
                'reason' => ! $expense->project ? 'No project' : 'No budget',
            ]);
        }

        if ($expense->budgetCategory) {
            \Log::info('Calling updateCategoryBudget', [
                'category_id'   => $expense->budgetCategory->id,
                'category_type' => get_class($expense->budgetCategory),
            ]);
            $this->updateCategoryBudget($expense);
        }

        // Check for budget alerts
        $this->checkBudgetAlerts($expense);

        \Log::info('=== END: updateBudgetAfterApproval ===');
    }

    /**
     * Update project budget spent amounts
     */
    private function updateProjectBudget(ProjectExpense $expense): void
    {
        \Log::info('=== START: updateProjectBudget ===');

        if (! $expense->project || ! $expense->project->projectBudget) {
            \Log::warning('Early return from updateProjectBudget', [
                'has_project' => $expense->project ? true : false,
                'has_budget'  => $expense->project ? ($expense->project->projectBudget ? true : false) : false,
            ]);
            return;
        }

        $projectBudget = $expense->project->projectBudget;

        \Log::info('ProjectBudget variable details', [
            'type'                => gettype($projectBudget),
            'class'               => is_object($projectBudget) ? get_class($projectBudget) : null,
            'is_string'           => is_string($projectBudget),
            'value'               => $projectBudget,
            'has_expenses_method' => is_object($projectBudget) && method_exists($projectBudget, 'expenses'),
        ]);

        if (is_string($projectBudget)) {
            \Log::error('ProjectBudget is a string!', [
                'string_value'       => $projectBudget,
                'project_id'         => $expense->project_id,
                'project_attributes' => $expense->project->getAttributes(),
            ]);
            return;
        }

        \Log::info('About to call expenses() method');
        $totalSpent = $projectBudget->expenses()->approved()->sum('amount');

        // Rest of the original code...
        \Log::info('=== END: updateProjectBudget ===');
    }

    /**
     * Update category budget spent amounts
     */
    private function updateCategoryBudget(ProjectExpense $expense): void
    {
        if (! $expense->budgetCategory) {
            return;
        }

        $category      = $expense->budgetCategory;
        $categorySpent = $category->expenses()->approved()->sum('amount');

        // Calculate category utilization
        $utilizationPercentage = $category->allocated_amount > 0
            ? ($categorySpent / $category->allocated_amount) * 100
            : 0;

        // Cache category spending data
        cache()->put("category_spent_{$category->id}", $categorySpent, now()->addHours(1));
        cache()->put("category_utilization_{$category->id}", $utilizationPercentage, now()->addHours(1));
    }

    /**
     * Check for budget alerts and notifications
     */
    private function checkBudgetAlerts(ProjectExpense $expense): void
    {
        // Check project budget alerts
        if ($expense->project && $expense->project->projectBudget) {
            $projectBudget         = $expense->project->projectBudget;
            $utilizationPercentage = $projectBudget->utilization_percentage;

            if ($utilizationPercentage >= 90) {
                // Trigger critical budget alert
                $this->triggerBudgetAlert($projectBudget, 'critical', $utilizationPercentage);
            } elseif ($utilizationPercentage >= 75) {
                // Trigger warning budget alert
                $this->triggerBudgetAlert($projectBudget, 'warning', $utilizationPercentage);
            }
        }

        // Check category budget alerts
        if ($expense->budgetCategory) {
            $category              = $expense->budgetCategory;
            $utilizationPercentage = $category->utilization_percentage;

            if ($utilizationPercentage >= 100) {
                // Category over budget
                $this->triggerCategoryAlert($category, 'over_budget', $utilizationPercentage);
            } elseif ($utilizationPercentage >= 90) {
                // Category near budget limit
                $this->triggerCategoryAlert($category, 'near_limit', $utilizationPercentage);
            }
        }
    }

    /**
     * Trigger budget alert notification
     */
    private function triggerBudgetAlert(ProjectBudget $budget, string $type, float $percentage): void
    {
        // You can implement notification logic here
        // For example: send email, create notification record, etc.

        // Log the alert for now
        logger()->info("Budget Alert: Project {$budget->project->name} is at {$percentage}% utilization", [
            'project_id' => $budget->project_id,
            'budget_id'  => $budget->id,
            'type'       => $type,
            'percentage' => $percentage,
        ]);
    }

    /**
     * Trigger category alert notification
     */
    private function triggerCategoryAlert(BudgetCategory $category, string $type, float $percentage): void
    {
        // Log the category alert
        logger()->info("Category Alert: {$category->name} is at {$percentage}% utilization", [
            'category_id'       => $category->id,
            'project_budget_id' => $category->project_budget_id,
            'type'              => $type,
            'percentage'        => $percentage,
        ]);
    }

    /**
     * Get budget summary for a project
     */
    public function getProjectBudgetSummary(int $projectId): array
    {
        $projectBudget = ProjectBudget::where('project_id', $projectId)->first();

        if (! $projectBudget) {
            return [];
        }

        $totalSpent            = $projectBudget->total_spent;
        $remainingBudget       = $projectBudget->remaining_budget;
        $utilizationPercentage = $projectBudget->utilization_percentage;

        // Get category breakdown
        $categories = $projectBudget->categories->map(function ($category) {
            return [
                'id'                     => $category->id,
                'name'                   => $category->name,
                'allocated_amount'       => $category->allocated_amount,
                'spent_amount'           => $category->total_spent,
                'remaining_amount'       => $category->remaining_amount,
                'utilization_percentage' => $category->utilization_percentage,
                'is_over_budget'         => $category->is_over_budget,
                'color'                  => $category->color,
            ];
        });

        return [
            'total_budget'           => $projectBudget->total_budget,
            'total_spent'            => $totalSpent,
            'remaining_budget'       => $remainingBudget,
            'utilization_percentage' => $utilizationPercentage,
            'currency'               => $projectBudget->currency,
            'categories'             => $categories,
            'status'                 => $this->getBudgetStatus($utilizationPercentage),
        ];
    }

    /**
     * Get budget status based on utilization percentage
     */
    private function getBudgetStatus(float $utilizationPercentage): string
    {
        if ($utilizationPercentage >= 100) {
            return 'over_budget';
        } elseif ($utilizationPercentage >= 90) {
            return 'critical';
        } elseif ($utilizationPercentage >= 75) {
            return 'warning';
        } else {
            return 'healthy';
        }
    }
}
