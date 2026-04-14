<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInstructor_Time_BlockRequest extends FormRequest
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
            'data.type' => ['required', 'in:instructor_time_blocks'],
            'data.attributes' => ['required', 'array:instructor_id,note,days,start_time,duration', 'min:1'],
            'data.id' => ['sometimes', 'integer'],

            'data.attributes.instructor_id' => ['sometimes', 'exists:instructors,id'],
            'data.attributes.note' => ['sometimes', 'string', 'max:255'],
            'data.attributes.days' => ['sometimes', 'string', 'regex:/^[MTWRF]+$/'],
            'data.attributes.start_time' => ['sometimes', 'date_format:H:i'],
            'data.attributes.duration' => ['sometimes', 'decimal:2', 'gt:0'],
        ];
    }
}
