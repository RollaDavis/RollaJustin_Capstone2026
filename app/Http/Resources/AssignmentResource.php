<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => 'assignments',
            'id' => $this->id,
            'attributes' => [
                'course_name' => $this->section->course->name,
                'days' => $this->timeslot->days,
                'room_name' => $this->room->name,
                'start_time' => $this->timeslot->start_time,
                'duration' => $this->timeslot->duration,
            ]
        ];
    }
}
