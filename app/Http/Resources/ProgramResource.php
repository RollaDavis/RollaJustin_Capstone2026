<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => 'programs',
            'id' => $this->program_id,
            'attributes' => [
                'year' => $this->year,
                'name' => $this->program->name,
            ]
        ];
    }
}
