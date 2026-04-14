<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAssignmentLogRequest extends FormRequest
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
            'data.type' => ['required', 'in:assignment_logs'],
            'data.attributes' => ['required', 'array', 'required_array_keys:assignment_id,user_id,instructor_id,section_id,room_id,timeslot_id,term_id'],
            'data.id' => ['sometimes', 'integer'],

            'data.attributes.assignment_id' => ['required', 'exists:assignments,id'],
            'data.attributes.user_id' => ['required', 'exists:users,id'],
            'data.attributes.instructor_id' => ['required', 'exists:instructors,id'],
            'data.attributes.section_id' => ['required', 'exists:sections,id'],
            'data.attributes.room_id' => ['required', 'exists:rooms,id'],
            'data.attributes.timeslot_id' => ['nullable', 'exists:timeslots,id'],
            'data.attributes.term_id' => ['required', 'exists:terms,id'],
        ];
    }
}
