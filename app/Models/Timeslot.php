<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Timeslot extends Model
{
    /** @use HasFactory<\Database\Factories\TimeslotFactory> */
    use HasFactory;

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function instructor(): HasMany
    {
        return $this->hasMany(Instructor::class);
    }

    public function room(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function section(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
