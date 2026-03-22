<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use JeroenZwart\CsvSeeder\CsvSeeder;

class AssignmentsSeeder extends CsvSeeder
{
    public function __construct()
    {
        $this->file = '/database/seeds/csvs/assignments.csv';
        $this->delimiter = ',';
        $this->tablename = 'assignments';
        $this->mapping = ['id', 'instructors_rooms_sections_id', 'timeslot_id', 'term_id'];
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
