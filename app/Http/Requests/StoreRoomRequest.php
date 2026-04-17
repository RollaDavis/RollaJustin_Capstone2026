<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRoomRequest extends FormRequest
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
            'data.type' => ['required', 'in:rooms'],
            'data.attributes' => ['required', 'array', 'required_array_keys:name,active'],
            'data.id' => ['sometimes', 'integer'],

            'data.attributes.name' => ['required', 'string', 'max:255'],
            'data.attributes.active' => ['required', 'integer', 'in:0,1'],
        ];
    }
}
