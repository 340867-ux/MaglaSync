<?php

defined('MOODLE_INTERNAL') || die();

function local_maglasync_context_extend_navigation_course(navigation_node $navigation, stdClass $course, context_course $context): void {
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
