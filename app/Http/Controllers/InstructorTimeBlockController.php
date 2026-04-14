<?php

namespace App\Http\Controllers;

use App\Models\Instructor_Time_Block;
use App\Http\Requests\StoreInstructor_Time_BlockRequest;
use App\Http\Requests\UpdateInstructor_Time_BlockRequest;
use App\Http\Resources\InstructorTimeBlockResource;
use App\Models\Instructor;

class InstructorTimeBlockController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Instructor $instructor)
    {
        return InstructorTimeBlockResource::collection($instructor->instructorTimeBlocks()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Instructor $instructor, StoreInstructor_Time_BlockRequest $request)
    {
        $instructorTimeBlock = $instructor->instructorTimeBlocks()->create($request->validated()['data']['attributes']);
        return new InstructorTimeBlockResource($instructorTimeBlock);
    }

    /**
     * Display the specified resource.
     */
    public function show(Instructor $instructor, Instructor_Time_Block $timeblock)
    {
        return new InstructorTimeBlockResource($timeblock);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Instructor $instructor, Instructor_Time_Block $timeblock, UpdateInstructor_Time_BlockRequest $request)
    {
        $timeblock->update($request->validated()['data']['attributes']);
        return new InstructorTimeBlockResource($timeblock);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Instructor $instructor, Instructor_Time_Block $timeblock)
    {
        $timeblock->delete();
        return response()->noContent();
    }
}
