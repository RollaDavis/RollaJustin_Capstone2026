<?php

namespace App\Http\Controllers;

use App\Models\Room_Time_Block;
use App\Http\Requests\StoreRoom_Time_BlockRequest;
use App\Http\Requests\UpdateRoom_Time_BlockRequest;
use App\Http\Resources\RoomTimeBlockResource;
use App\Models\Room;

class RoomTimeBlockController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Room $room)
    {
        return RoomTimeBlockResource::collection($room->roomTimeBlocks()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Room $room, StoreRoom_Time_BlockRequest $request)
    {
        $roomTimeBlock = $room->roomTimeBlocks()->create($request->validated()['data']['attributes']);
        return new RoomTimeBlockResource($roomTimeBlock);
    }

    /**
     * Display the specified resource.
     */
    public function show(Room $room, Room_Time_Block $timeblock)
    {
        return new RoomTimeBlockResource($timeblock);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Room $room, Room_Time_Block $timeblock, UpdateRoom_Time_BlockRequest $request)
    {
        $timeblock->update($request->validated()['data']['attributes']);
        return new RoomTimeBlockResource($timeblock);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Room $room, Room_Time_Block $timeblock)
    {
        $timeblock->delete();
        return response()->noContent();
    }
}
