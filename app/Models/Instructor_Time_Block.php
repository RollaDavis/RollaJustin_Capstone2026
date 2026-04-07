<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Instructor_Time_Block extends Model
{
    /** @use HasFactory<\Database\Factories\InstructorTimeBlockFactory> */
    use HasFactory;

    protected $fillable = ['instructor_id', 'days', 'start_time', 'duration'];

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }
}
