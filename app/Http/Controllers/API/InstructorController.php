<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Instructor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InstructorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $instructors = Auth::user()->instructors;
        return $instructors;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request['user_id'] = Auth::user()->id;
        $instructor = new Instructor($request->all());
        $instructor->save();
        response()->json([
            "message" => "Instructor Created"
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Instructor $instructor)
    {
        if($instructor->user_id == Auth::user()->id) {
            return $instructor;
        }
        abort(403);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Instructor $instructor)
    {
        if($instructor->user_id == Auth::user()->id) {
            $instructor->update($request->all());
        }
        response()->json([
            "message" => "Instructor Updated"
        ], 201);
        abort(403);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Instructor $instructor)
    {
        if($instructor->user_id == Auth::user()->id) {
            $instructor->delete();
        }
        response()->json([
            "message" => "Instructor Deleted"
        ], 201);
        abort(403);
    }
}
