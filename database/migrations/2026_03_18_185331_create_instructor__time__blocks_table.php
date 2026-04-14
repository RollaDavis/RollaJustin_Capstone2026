<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('instructor__time__blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instructor_id')->constrained()->onDelete('cascade');
            $table->string('note')->nullable();
            $table->string('days', 5);
            $table->time('start_time');
            $table->integer('duration')->comment('Duration in hours');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instructor__time__blocks');
    }
};
