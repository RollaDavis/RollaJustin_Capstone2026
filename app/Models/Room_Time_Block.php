<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Room_Time_Block extends Model
{
    /** @use HasFactory<\Database\Factories\RoomTimeBlockFactory> */
    use HasFactory;

    protected $fillable = ['room_id', 'note', 'days', 'start_time', 'duration'];

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
