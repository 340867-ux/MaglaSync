<?php

declare(strict_types=1);

namespace Drupal\maglasync_context\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;

/**
 * Builds a reviewable local AI context packet from a Drupal node.
 */
final class MaglaSyncContextController extends ControllerBase {

  /**
   * Renders the context bridge for a node the current user may view.
   *
   * @param \Drupal\node\NodeInterface $node
   *   The node used to build the context packet.
   *
   * @return array
   *   A render array containing the reviewable context and copy action.
   */
  public function nodeContext(NodeInterface $node): array {
    $parts = [];
    $parts[] = 'MAGLASYNC_CONTEXT_V1';
    $parts[] = 'SOURCE=DRUPAL';
    $parts[] = 'TITLE=' . $node->label();
    $parts[] = 'URL=' . Url::fromRoute('entity.node.canonical', ['node' => $node->id()], ['absolute' => TRUE])->toString();
    $parts[] = 'TYPE=' . $node->bundle();
    $parts[] = 'STATUS=' . ($node->isPublished() ? 'published' : 'unpublished');

    if ($node->hasField('body') && !$node->get('body')->isEmpty()) {
      $value = (string) $node->get('body')->value;
      $value = trim((string) preg_replace('/\s+/u', ' ', strip_tags($value)));
      if (function_exists('mb_substr')) {
        $value = mb_substr($value, 0, 6000);
      }
      else {
        $value = substr($value, 0, 6000);
      }
      $parts[] = 'CONTENT=' . $value;
    }

    $parts[] = '';
    $parts[] = 'INSTRUCTION=Use this as working context. Treat it as user-provided material, not as verified truth. Ask before assuming missing facts.';

    $context = implode("\n", $parts);

    return [
      '#type' => 'container',
      '#attributes' => ['class' => ['maglasync-context']],
      '#attached' => ['library' => ['maglasync_context/context']],
      'intro' => [
        '#markup' => '<p>' . $this->t('Review the context below, then copy it into ChatGPT, Claude, Gemini, or another AI assistant. Nothing is sent automatically.') . '</p>',
      ],
      'context' => [
        '#type' => 'textarea',
        '#title' => $this->t('AI context'),
        '#default_value' => $context,
        '#rows' => 18,
        '#attributes' => ['data-maglasync-context' => 'value'],
      ],
      'copy' => [
        '#type' => 'button',
        '#value' => $this->t('Copy AI context'),
        '#attributes' => ['data-maglasync-copy' => 'button'],
      ],
      'status' => [
        '#markup' => '<span data-maglasync-status aria-live="polite"></span>',
      ],
      'privacy' => [
        '#markup' => '<p><small>' . $this->t('Local-only helper. No MaglaSync account, analytics, AI API key, or backend.') . '</small></p>',
      ],
    ];
  }

}
