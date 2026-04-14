<?php

namespace App\Http\Controllers;

use App\Models\AssignmentLog;
use App\Http\Requests\StoreAssignmentLogRequest;
use App\Http\Requests\UpdateAssignmentLogRequest;
use App\Http\Resources\AssignmentLogResource;
use App\Models\Assignment;
use App\Models\Term;

class AssignmentLogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Term $term, Assignment $assignment)
    {
        return AssignmentLogResource::collection($assignment->assignmentLogs()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Term $term, Assignment $assignment, StoreAssignmentLogRequest $request)
    {
        $assignmentLog = $assignment->assignmentLogs()->create($request->validated()['data']['attributes']);
        return new AssignmentLogResource($assignmentLog);
    }

    /**
     * Display the specified resource.
     */
    public function show(Term $term, Assignment $assignment, AssignmentLog $assignmentLog)
    {
        return new AssignmentLogResource($assignmentLog);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Term $term, Assignment $assignment, AssignmentLog $assignmentLog)
    {
        $assignmentLog->delete();
        return response()->noContent();
    }
}
