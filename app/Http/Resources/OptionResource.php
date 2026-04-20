<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => 'options',
            'id' => $this['id'],
            'attributes' => [
                'conflicting' => $this['conflicting'],
                'days' => $this['days'],
                'start_time' => $this['start_time'],
                'duration' => $this['duration'],
                'conflicts' => $this['conflicts']
            ],
            'relationships' => [
                'timeslot' => [
                    'data' => [
                        'type' => 'timeslots',
                        'id' => $this['timeslot_id'],
                    ]
                ],
            ]
        ];
    }
}

