<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Instructor_Time_Block extends Model
{
    /** @use HasFactory<\Database\Factories\InstructorTimeBlockFactory> */
    use HasFactory;

    protected $fillable = ['instructor_id', 'note', 'days', 'start_time', 'duration'];

    /**
     * Store duration as integer minutes in the database.
     * Incoming value is expected as hours (float/string like "1.17").
     */
    public function setDurationAttribute($value)
    {
        if ($value === null || $value === '') {
            $this->attributes['duration'] = null;
            return;
        }

        // Treat numeric value as hours and convert to minutes
        if (is_numeric($value)) {
            $minutes = (int) round(((float) $value) * 60);
            $this->attributes['duration'] = $minutes;
            return;
        }

        // Fallback: store as-is (best-effort)
        $this->attributes['duration'] = $value;
    }

    /**
     * Expose duration as hours (with two decimals) for API consumers.
     */
    public function getDurationAttribute($value)
    {
        if ($value === null || $value === '') {
            return null;
        }

        // If stored value looks like minutes (integer), convert to hours
        if (is_numeric($value)) {
            $hours = ((float) $value) / 60.0;
            return number_format($hours, 2, '.', '');
        }

        return $value;
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }
}
