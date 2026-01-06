<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use App\Services\StorageConfigService;

class MediaItem extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = ['name', 'description'];
    
    protected $appends = ['url', 'thumb_url', 'mime_type'];
    
    protected $visible = ['id', 'name', 'description', 'url', 'thumb_url', 'mime_type', 'created_at', 'updated_at'];
    
    public function getUrlAttribute()
    {
        $media = $this->getFirstMedia('images');
        return $media ? $media->getUrl() : null;
    }
    
    public function getMimeTypeAttribute()
    {
        $media = $this->getFirstMedia('images');
        return $media ? $media->mime_type : null;
    }
    
    public function getThumbUrlAttribute()
    {
        $media = $this->getFirstMedia('images');
        return $media ? $media->getUrl('thumb') : $this->getUrlAttribute();
    }
    
    public function toArray()
    {
        $array = parent::toArray();
        // Ensure appended attributes are always included
        $array['url'] = $this->url;
        $array['thumb_url'] = $this->thumb_url;
        return $array;
    }

    // public function registerMediaCollections(): void
    // {
    //     $config = StorageConfigService::getStorageConfig();
    //     $allowedExtensions = array_map('trim', explode(',', strtolower($config['allowed_file_types'])));
    //     $maxSizeBytes = ($config['max_file_size_mb'] ?? 2) * 1024 * 1024; // Convert MB to bytes
        
    //     $this->addMediaCollection('images')
    //         ->acceptsFile(function ($file) use ($allowedExtensions, $maxSizeBytes) {
    //             // Check file extension
    //             $fileName = $file->name ?? $file->getFilename();
    //             $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                
    //             if (!in_array($extension, $allowedExtensions)) {
    //                 return false;
    //             }
                
    //             // Check file size
    //             $fileSize = $file->size ?? filesize($file->getPathname());
    //             if ($fileSize > $maxSizeBytes) {
    //                 return false;
    //             }
                
    //             return true;
    //         })
    //         ->useDisk(StorageConfigService::getActiveDisk());
    // }

    
    public function registerMediaCollections(): void
    {
        $config = StorageConfigService::getStorageConfig();
        $allowedExtensions = array_map('trim', explode(',', strtolower($config['allowed_file_types'])));
        $maxSizeBytes = ($config['max_file_size_mb'] ?? 2) * 1024 * 1024; // Convert MB to bytes
        
        $disk = $config['disk'];
        
        // Configure S3 dynamically from database if using S3
        if ($disk === 's3' && !empty($config['s3'])) {
            $s3Config = $config['s3'];
            
            // Validate S3 configuration
            if (empty($s3Config['key']) || empty($s3Config['secret']) || empty($s3Config['bucket'])) {
                \Log::error('S3 configuration incomplete in database', [
                    'has_key' => !empty($s3Config['key']),
                    'has_secret' => !empty($s3Config['secret']),
                    'has_bucket' => !empty($s3Config['bucket']),
                    'has_region' => !empty($s3Config['region']),
                ]);
                throw new \Exception('S3 configuration is incomplete. Please check your storage settings.');
            }
            
            // Set S3 configuration dynamically
            config([
                'filesystems.disks.s3.driver' => 's3',
                'filesystems.disks.s3.key' => $s3Config['key'],
                'filesystems.disks.s3.secret' => $s3Config['secret'],
                'filesystems.disks.s3.region' => $s3Config['region'] ?: 'us-east-1',
                'filesystems.disks.s3.bucket' => $s3Config['bucket'],
                'filesystems.disks.s3.url' => $s3Config['url'],
                'filesystems.disks.s3.endpoint' => $s3Config['endpoint'],
            ]);
            
            \Log::info('S3 configured from database', [
                'bucket' => $s3Config['bucket'],
                'region' => $s3Config['region'] ?: 'us-east-1',
                'has_endpoint' => !empty($s3Config['endpoint']),
            ]);
        }
        
        $this->addMediaCollection('images')
            ->acceptsFile(function ($file) use ($allowedExtensions, $maxSizeBytes) {
                // Check file extension
                $fileName = $file->name ?? $file->getFilename();
                $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                
                if (!in_array($extension, $allowedExtensions)) {
                    return false;
                }
                
                // Check file size
                $fileSize = $file->size ?? filesize($file->getPathname());
                if ($fileSize > $maxSizeBytes) {
                    return false;
                }
                
                return true;
            })
            ->useDisk($disk);
    }
    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(300)
            ->height(300)
            ->sharpen(10)
            ->performOnCollections('images')
            ->nonQueued();
    }
}