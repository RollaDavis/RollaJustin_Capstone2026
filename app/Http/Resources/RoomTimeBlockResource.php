<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomTimeBlockResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => 'room_time_blocks',
            'id' => $this->id,
            'attributes' => [
                'room_id' => $this->room->id,
                'days' => $this->days,
                'start_time' => $this->start_time,
                'duration' => $this->duration,
            ]
        ];
    }
}
