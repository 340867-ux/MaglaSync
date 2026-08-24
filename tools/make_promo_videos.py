#!/usr/bin/env python3
"""Build silent captioned promo rough cuts for voice-over and music finishing."""

from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory

from make_launch_assets import PROMO, promo_card, save_png


VERTICAL = [
    ("Опять объяснять проект с нуля?", "Новый чат ничего не знает о вчерашней работе.", "ЗНАКОМО?"),
    ("Подключите только нужный чат", "Неподключённые разговоры MaglaSync не читает.", "ВЫ РЕШАЕТЕ"),
    ("ChatGPT → Claude → Gemini", "Цель, решения и следующие шаги переходят вместе с проектом.", "ОДИН ПРОЕКТ"),
    ("Вы проверяете. Вы нажимаете Send.", "Расширение никогда не отправляет сообщение само.", "ПОД ВАШИМ КОНТРОЛЕМ"),
    ("Локально. Без аккаунта. Бесплатно.", "Скачайте MaglaSync Free и попробуйте на своём проекте.", "SYNC.MAGLA.RU"),
]

HORIZONTAL = [
    ("Каждый новый ИИ-чат забывает ваш проект", "И снова приходится объяснять цель, решения и ограничения.", "ПРОБЛЕМА"),
    ("Подключите нужный проектный чат", "До вашего клика MaglaSync не читает этот разговор.", "ШАГ 1"),
    ("Откройте предпросмотр контекста", "Сначала прочитайте и при необходимости измените передачу дел.", "ШАГ 2"),
    ("Поместите текст и нажмите Send", "MaglaSync никогда не отправляет сообщение вместо вас.", "ШАГ 3"),
    ("Без аккаунта, API-ключа и сервера", "Free работает локально и остаётся полезным без подписки.", "ПРИВАТНОСТЬ"),
    ("Попробуйте MaglaSync Free", "Открытый код, готовая сборка и честная граница данных.", "SYNC.MAGLA.RU"),
]


def build(name, size, slides, seconds, layout):
    PROMO.mkdir(exist_ok=True)
    with TemporaryDirectory(prefix="maglasync-promo-") as temporary:
        temp = Path(temporary)
        for index, (title, subtitle, badge) in enumerate(slides):
            save_png(promo_card(size, title, subtitle, badge, layout), temp / f"slide-{index}.png")

        command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
        for index in range(len(slides)):
            command.extend(["-loop", "1", "-t", str(seconds), "-i", str(temp / f"slide-{index}.png")])

        chains = []
        for index in range(len(slides)):
            chains.append(f"[{index}:v]scale={size[0]}:{size[1]},format=yuv420p,settb=AVTB[v{index}]")
        previous = "v0"
        transition = 0.45
        for index in range(1, len(slides)):
            output = f"x{index}"
            offset = index * (seconds - transition)
            chains.append(f"[{previous}][v{index}]xfade=transition=fade:duration={transition}:offset={offset:.2f}[{output}]")
            previous = output

        destination = PROMO / name
        temporary_video = PROMO / f".{name}.tmp.mp4"
        command.extend([
            "-filter_complex", ";".join(chains),
            "-map", f"[{previous}]", "-an", "-r", "30", "-c:v", "libx264",
            "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(temporary_video),
        ])
        run(command, check=True)
        if temporary_video.stat().st_size < 1000:
            raise RuntimeError(f"Generated video is empty: {name}")
        temporary_video.replace(destination)
        return destination


def main():
    vertical = build("maglasync-tiktok-ru.mp4", (1080, 1920), VERTICAL, 4, "vertical")
    horizontal = build("maglasync-youtube-ru.mp4", (1280, 720), HORIZONTAL, 6, "horizontal")
    print(f"PASS promo rough cuts: {vertical.name}, {horizontal.name}")


if __name__ == "__main__":
    main()
