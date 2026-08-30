<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Library hooks for the MaglaSync Context Bridge.
 *
 * @package    local_maglasync_context
 * @copyright  2026 MaglaSync
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Adds the AI Context link to course navigation for authorised users.
 *
 * @param navigation_node $navigation Course navigation node.
 * @param stdClass $course Course record.
 * @param context_course $context Course context.
 */
function local_maglasync_context_extend_navigation_course(
    navigation_node $navigation,
    stdClass $course,
    context_course $context
): void {
    if (!has_capability('local/maglasync_context:use', $context)) {
        return;
    }

    $url = new moodle_url('/local/maglasync_context/index.php', ['id' => $course->id]);
    $navigation->add(
        get_string('contextpage', 'local_maglasync_context'),
        $url,
        navigation_node::TYPE_SETTING,
        null,
        'maglasync_context'
    );
}
