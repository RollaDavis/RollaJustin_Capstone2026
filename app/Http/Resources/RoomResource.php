<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => 'rooms',
            'id' => $this->id,
            'attributes' => [
                'room_id' => $this->id,
                'name' => $this->name,
                'active' => $this->active,
            ]
        ];
    }
}
