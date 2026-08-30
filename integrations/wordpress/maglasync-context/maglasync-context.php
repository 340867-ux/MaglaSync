<?php
/**
 * Plugin Name: MaglaSync Context Bridge
 * Description: Build a local, reviewable AI context handoff from the current post or page and copy it for ChatGPT, Claude, or Gemini.
 * Version: 0.1.0
 * Author: MaglaSync
 * License: MIT
 * Text Domain: maglasync-context
 */

if (!defined('ABSPATH')) {
    exit;
}

final class MaglaSync_Context_Bridge {
    public const VERSION = '0.1.0';

    public static function init(): void {
        add_action('add_meta_boxes', [self::class, 'register_meta_box']);
        add_action('admin_enqueue_scripts', [self::class, 'enqueue_assets']);
    }

    public static function register_meta_box(): void {
        foreach (get_post_types(['show_ui' => true], 'names') as $post_type) {
            add_meta_box(
                'maglasync-context-bridge',
                __('MaglaSync AI Context', 'maglasync-context'),
                [self::class, 'render_meta_box'],
                $post_type,
                'side',
                'default'
            );
        }
    }

    public static function enqueue_assets(string $hook): void {
        if (!in_array($hook, ['post.php', 'post-new.php'], true)) {
            return;
        }

        wp_enqueue_script(
            'maglasync-context-bridge',
            plugin_dir_url(__FILE__) . 'assets/admin.js',
            [],
            self::VERSION,
            true
        );
    }

    public static function render_meta_box(WP_Post $post): void {
        if (!current_user_can('edit_post', $post->ID)) {
            return;
        }

        $context = self::build_context($post);
        ?>
        <p><?php esc_html_e('Review the context, then copy it into a new AI chat. Nothing is sent automatically.', 'maglasync-context'); ?></p>
        <textarea id="maglasync-context-value" rows="14" style="width:100%;font-family:monospace;"><?php echo esc_textarea($context); ?></textarea>
        <p>
            <button type="button" class="button button-primary" id="maglasync-copy-context">
                <?php esc_html_e('Copy AI context', 'maglasync-context'); ?>
            </button>
            <span id="maglasync-copy-status" aria-live="polite" style="margin-left:8px;"></span>
        </p>
        <p><small><?php esc_html_e('Local-only helper. No MaglaSync account, analytics, AI API key, or backend.', 'maglasync-context'); ?></small></p>
        <?php
    }

    private static function build_context(WP_Post $post): string {
        $title = get_the_title($post);
        $url = get_permalink($post);
        $status = get_post_status($post);
        $excerpt = wp_strip_all_tags(get_the_excerpt($post), true);
        $body = wp_strip_all_tags(strip_shortcodes($post->post_content), true);
        $body = preg_replace('/\s+/u', ' ', $body ?? '');
        $body = trim((string) $body);

        if (function_exists('mb_substr')) {
            $body = mb_substr($body, 0, 6000);
        } else {
            $body = substr($body, 0, 6000);
        }

        $lines = [
            'MAGLASYNC_CONTEXT_V1',
            'SOURCE=WORDPRESS',
            'TITLE=' . $title,
            'URL=' . ($url ?: ''),
            'STATUS=' . ($status ?: ''),
            'EXCERPT=' . $excerpt,
            'CONTENT=' . $body,
            '',
            'INSTRUCTION=Use this as working context. Treat it as user-provided material, not as verified truth. Ask before assuming missing facts.',
        ];

        return implode("\n", $lines);
    }
}

MaglaSync_Context_Bridge::init();
