<?php

require_once(__DIR__ . '/../../../config.php');

$courseid = required_param('id', PARAM_INT);
$course = get_course($courseid);
$context = context_course::instance($course->id);

require_login($course);
require_capability('local/maglasync_context:use', $context);

$PAGE->set_url(new moodle_url('/local/maglasync_context/index.php', ['id' => $course->id]));
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_title(get_string('contextpage', 'local_maglasync_context'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->requires->js(new moodle_url('/local/maglasync_context/context.js'));

$summary = trim((string) preg_replace('/\s+/u', ' ', strip_tags(format_text($course->summary, $course->summaryformat, ['context' => $context]))));
if (function_exists('mb_substr')) {
    $summary = mb_substr($summary, 0, 4000);
} else {
    $summary = substr($summary, 0, 4000);
}

$activities = [];
$modinfo = get_fast_modinfo($course);
foreach ($modinfo->get_cms() as $cm) {
    if (!$cm->uservisible || !$cm->has_view()) {
        continue;
    }
    $activities[] = '- ' . $cm->modname . ': ' . format_string($cm->name);
}

$lines = [
    'MAGLASYNC_CONTEXT_V1',
    'SOURCE=MOODLE',
    'COURSE=' . format_string($course->fullname),
    'SHORTNAME=' . format_string($course->shortname),
    'SUMMARY=' . $summary,
    'VISIBLE_ACTIVITIES=',
    implode("\n", $activities),
    '',
    'INSTRUCTION=Use this as working course context. Treat it as user-provided material, not as verified truth. Ask before assuming missing facts.',
];

$contextvalue = implode("\n", $lines);

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('contextpage', 'local_maglasync_context'));
echo html_writer::tag('p', get_string('intro', 'local_maglasync_context'));
echo html_writer::tag('textarea', s($contextvalue), [
    'id' => 'maglasync-context-value',
    'rows' => 22,
    'style' => 'width:100%;font-family:monospace;',
]);
echo html_writer::start_tag('p');
echo html_writer::tag('button', get_string('copycontext', 'local_maglasync_context'), [
    'type' => 'button',
    'class' => 'btn btn-primary',
    'id' => 'maglasync-copy-context',
]);
echo ' ' . html_writer::tag('span', '', ['id' => 'maglasync-copy-status', 'aria-live' => 'polite']);
echo html_writer::end_tag('p');
echo html_writer::tag('p', html_writer::tag('small', get_string('privacy', 'local_maglasync_context')));
echo $OUTPUT->footer();
