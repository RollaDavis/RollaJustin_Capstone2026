<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    /** @use HasFactory<\Database\Factories\RoomFactory> */
    use HasFactory;

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function possibilities(): HasMany
    {
        return $this->hasMany(Possibility::class);
    }

    public function roomTimeBlocks(): HasMany
    {
        return $this->hasMany(Room_Time_Block::class);
    }

    public function timeslots(): HasMany
    {
        return $this->hasMany(Timeslot::class);
    }
}
