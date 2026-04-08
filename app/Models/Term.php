<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Term extends Model
{
    /** @use HasFactory<\Database\Factories\TermFactory> */
    use HasFactory;

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function programAssignments(): HasMany
    {
        return $this->hasMany(ProgramAssignment::class);
    }

    public function instructors() {
        return $this->hasManyThrough(Instructor::class, Assignment::class, 'term_id', 'id', 'id', 'instructor_id')->distinct();
    }

    public function rooms() {
        return $this->hasManyThrough(Room::class, Assignment::class, 'term_id', 'id', 'id', 'room_id')->distinct();
    }

    public function programs() {
        return $this->hasManyThrough(Program::class, ProgramAssignment::class, 'terms_id', 'id', 'id', 'programs_id')->distinct();
    }
}