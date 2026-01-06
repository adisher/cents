<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTemplateAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        // Check if user has permission to view templates
        if (! $user || ! $user->can('template_view_any')) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => __('Access denied. You do not have permission to access templates.'),
                ], 403);
            }
            abort(403, __('Access denied. You do not have permission to access templates.'));
        }

        // If permission check passes, continue to the next middleware/controller
        return $next($request);
    }
}
