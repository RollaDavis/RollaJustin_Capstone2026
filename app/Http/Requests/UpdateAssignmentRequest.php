<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAssignmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'data' => ['required', 'array', 'required_array_keys:type,attributes'],
            'data.type' => ['required', 'in:assignments'],
            'data.attributes' => ['required', 'array', 'required_array_keys:assignment_id,user_id,instructor_id,section_id,room_id,timeslot_id,term_id'],
            'data.id' => ['sometimes', 'integer'],

            'data.attributes.assignment_id' => ['sometimes', 'exists:assignments,id'],
            'data.attributes.user_id' => ['sometimes', 'exists:users,id'],
            'data.attributes.instructor_id' => ['sometimes', 'exists:instructors,id'],
            'data.attributes.section_id' => ['sometimes', 'exists:sections,id'],
            'data.attributes.room_id' => ['sometimes', 'exists:rooms,id'],
            'data.attributes.timeslot_id' => ['sometimes', 'nullable', 'exists:timeslots,id'],
            'data.attributes.term_id' => ['sometimes', 'exists:terms,id'],
        ];
    }
}
