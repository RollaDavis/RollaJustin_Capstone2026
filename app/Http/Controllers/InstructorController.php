<?php

namespace App\Http\Controllers;

use App\Models\Instructor;
use App\Http\Resources\InstructorResource;
use App\Http\Requests\StoreInstructorRequest;
use App\Http\Requests\UpdateInstructorRequest;

class InstructorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $instructors = Instructor::all();

        return InstructorResource::collection($instructors);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreInstructorRequest $request)
    {
        $attributes = $request->validated()['data']['attributes'];

        $instructor = Instructor::create($attributes);

        return new InstructorResource($instructor);
    }

    /**
     * Display the specified resource.
     */
    public function show(Instructor $instructor)
    {
        return new InstructorResource($instructor);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateInstructorRequest $request, Instructor $instructor)
    {
        $attributes = $request->validated()['data']['attributes'];

        $instructor->update($attributes);

        return new InstructorResource($instructor);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Instructor $instructor)
    {
        $instructor->delete();

        return response()->json(null, 204);
    }
}
