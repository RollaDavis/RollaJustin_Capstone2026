<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstructorTimeBlockResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => 'instructor_time_blocks',
            'id' => $this->id,
            'attributes' => [
                'instructor_id' => $this->instructor->id,
                'note' => $this->note,
                'days' => $this->days,
                'start_time' => $this->start_time,
                'duration' => $this->duration,
            ]
        ];
    }
}
