<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentLog extends Model
{
    /** @use HasFactory<\Database\Factories\AssignmentLogFactory> */
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'user_id',
        'instructor_id',
        'section_id',
        'room_id',
        'timeslot_id',
        'term_id',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
