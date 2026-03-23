<?php

use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Instructor;
use App\Http\Controllers\API\InstructorController;

Route::middleware('auth:sanctum')->group(function() {
    Route::prefix('v1')->group(function () {
        // Route::apiResource('instructors', InstructorController::class);
        // Route::get('/instructors', function(Request $request) {
        //     return Instructor::all();
        // });
    });
});

Route::get('/instructors', function(Request $request) {
    return Instructor::all();
});

Route::get('/rooms', function(Request $request) {
    return Room::all();
});
    