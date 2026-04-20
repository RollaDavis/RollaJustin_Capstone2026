<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use JeroenZwart\CsvSeeder\CsvSeeder;

class TimeslotSeeder extends CsvSeeder
{
    public function __construct()
    {
        $this->file = '/database/seeds/csvs/timeslots.csv';
        $this->delimiter = ',';
        $this->tablename = 'timeslots';
        $this->truncate = false;
        $this->mapping = ['id', 'days', 'start_time', 'duration', 'location_id'];
        $this->parsers = ['start_time' => function ($value) { 
            return substr_replace($value, ':', 2, 0);
        }];
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
