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
                'course_name' => $this->section && $this->section->course ? $this->section->course->name : null,
                'days' => $this->timeslot ? $this->timeslot->days : null,
                'room_name' => $this->room ? $this->room->name : null,
                'instructor_name' => $this->instructor ? $this->instructor->name : null,
                'start_time' => $this->timeslot ? $this->timeslot->start_time : null,
                'duration' => $this->timeslot ? $this->timeslot->duration : null,
            ],
            'relationships' => [
                'section' => [
                    'data' => [
                        'type' => 'sections',
                        'id' => $this->section ? $this->section->id : null,
                    ]
                ],
                'room' => [
                    'data' => [
                        'type' => 'rooms',
                        'id' => $this->room ? $this->room->id : null,
                    ]
                ],
                'instructor' => [
                    'data' => [
                        'type' => 'instructors',
                        'id' => $this->instructor ? $this->instructor->id : null,
                    ]
                ],
                'timeslot' => [
                    'data' => [
                        'type' => 'timeslots',
                        'id' => $this->timeslot ? $this->timeslot->id : null,
                    ]
                ],
                'term' => [
                    'data' => [
                        'type' => 'terms',
                        'id' => $this->term ? $this->term->id : null,
                    ]
                ]
            ]
        ];
    }
}
