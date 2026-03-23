<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Instructor;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->get('/instructors', function(Request $request) {
    return Instructor::all();
});
