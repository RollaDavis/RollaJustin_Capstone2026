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
                'instructor_name' => $this->instructor->name,
                'start_time' => $this->timeslot->start_time,
                'duration' => $this->timeslot->duration,
            ],
            'relationships' => [
                'section' => [
                    'data' => [
                        'type' => 'sections',
                        'id' => $this->section->id,
                    ]
                ],
                'room' => [
                    'data' => [
                        'type' => 'rooms',
                        'id' => $this->room->id,
                    ]
                ],
                'instructor' => [
                    'data' => [
                        'type' => 'instructors',
                        'id' => $this->instructor->id,
                    ]
                ],
                'timeslot' => [
                    'data' => [
                        'type' => 'timeslots',
                        'id' => $this->timeslot->id,
                    ]
                ]
            ]
        ];
    }
}
