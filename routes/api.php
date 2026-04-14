<?php

use App\Models\Program;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Instructor;
use App\Http\Controllers\TermController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\InstructorController;
use App\Http\Controllers\InstructorTimeBlockController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\RoomTimeBlockController;
use App\Http\Controllers\AssignmentLogController;

Route::prefix('v1')->group(function () {
    // INSTRUCTORS
    Route::get('/instructors', function(Request $request) {
        return Instructor::orderBy('name')->get();
    });
    Route::get('terms/{term}/instructors', [AssignmentController::class, 'getTermInstructors']);
    Route::get('terms/{term}/instructors/{instructor}', [AssignmentController::class, 'getAssignmentsForInstructor']);
    Route::apiResource('instructors', InstructorController::class);
    Route::apiResource('instructors/{instructor}/timeblocks', InstructorTimeBlockController::class);

    // ROOMS
    Route::get('/rooms', function(Request $request) {
        return Room::all();
    });
    Route::get('terms/{term}/rooms', [AssignmentController::class, 'getTermRooms']);
    Route::get('terms/{term}/rooms/{room}', [AssignmentController::class, 'getAssignmentsForRoom']);
    Route::apiResource('rooms', RoomController::class);
    Route::apiResource('rooms/{room}/timeblocks', RoomTimeBlockController::class);

    // PROGRAMS
    Route::get('/programs', function(Request $request) {
        return Program::all();
    });
    Route::get('terms/{term}/programs', [AssignmentController::class, 'getTermPrograms']);
    Route::get('terms/{term}/programs/{program}/{year}', [AssignmentController::class, 'getAssignmentsForProgram']);

    // TERMS
    Route::apiResource('terms', TermController::class);

    // ASSIGNMENTS
    Route::apiResource('terms/{term}/assignments', AssignmentController::class);
    Route::get('terms/{term}/assignments/{assignment}/options', [AssignmentController::class, 'showAssignmentOptions']);
    Route::get('terms/{term}/assignments/{assignment}/conflicts', [AssignmentController::class, 'showAssignmentConflicts']);
    Route::apiResource('terms/{term}/assignments/{assignment}/logs', AssignmentLogController::class);
});