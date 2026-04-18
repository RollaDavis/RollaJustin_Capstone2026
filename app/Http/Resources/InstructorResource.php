<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstructorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => 'instructors',
            'id' => $this->id,
            'attributes' => [
                'instructor_id' => $this->id,
                'name' => $this->name,
                'active' => $this->active,
            ]
        ];
    }
}
