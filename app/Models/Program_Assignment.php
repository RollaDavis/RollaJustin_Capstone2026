<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramAssignment extends Model
{
    /** @use HasFactory<\Database\Factories\Pr> */
    use HasFactory;

    protected $fillable = ['programs_id', 'terms_id', 'course_id', 'year'];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

}
