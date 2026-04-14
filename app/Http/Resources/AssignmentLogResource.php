<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignmentLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => 'assignment_logs',
            'id' => $this->id,
            'attributes' => [
                'assignment_id' => $this->assignment->id,
                'user_id' => $this->user->id,
                'instructor_id' => $this->instructor_id,
                'section_id' => $this->section_id,
                'room_id' => $this->room_id,
                'timeslot_id' => $this->timeslot_id,
                'term_id' => $this->term_id,
                'timestamp' => $this->created_at->toIso8601String(),
            ]
        ];
    }
}