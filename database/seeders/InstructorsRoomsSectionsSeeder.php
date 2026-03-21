<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use JeroenZwart\CsvSeeder\CsvSeeder;

class InstructorsRoomsSectionsSeeder extends CsvSeeder
{
    public function __construct()
    {
        $this->file = '/database/seeds/csvs/instructors_rooms_sections.csv';
        $this->delimiter = ',';
        $this->tablename = 'instructors_rooms_sections';
        $this->mapping = ['id', 'instructor_id', 'room_id', 'section_id'];
    }

    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        parent::run();
    }
}
