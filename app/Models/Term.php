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
}
