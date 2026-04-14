<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRoom_Time_BlockRequest extends FormRequest
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
            'data.type' => ['required', 'in:room_time_blocks'],
            'data.attributes' => ['required', 'array:room_id,days,start_time,duration', 'min:1'],
            'data.id' => ['sometimes', 'integer'],

            'data.attributes.room_id' => ['sometimes', 'exists:rooms,id'],
            'data.attributes.days' => ['sometimes', 'string', 'regex:/^[MTWRF]+$/'],
            'data.attributes.start_time' => ['sometimes', 'date_format:H:i'],
            'data.attributes.duration' => ['sometimes', 'decimal:2', 'gt:0'],
        ];
    }
}
