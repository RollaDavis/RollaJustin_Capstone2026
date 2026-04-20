<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use JeroenZwart\CsvSeeder\CsvSeeder;

class PossibilitiesSeeder extends CsvSeeder
{
    public function __construct()
    {
        $this->file = '/database/seeds/csvs/possibilities.csv';
        $this->delimiter = ',';
        $this->tablename = 'possibilities';
        $this->truncate = false;
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
