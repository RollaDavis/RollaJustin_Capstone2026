<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Instructor extends Model
{
    /** @use HasFactory<\Database\Factories\InstructorFactory> */
    use HasFactory;

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function timeslots(): HasMany
    {
        return $this->hasMany(Timeslot::class);
    }

    public function instructorTimeBlocks(): HasMany
    {
        return $this->hasMany(Instructor_Time_Block::class);
    }

    public function possibilities(): HasMany
    {
        return $this->hasMany(Possibility::class);
    }
}
