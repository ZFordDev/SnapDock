import json
import os
import tempfile
import unittest

import snapdock.persistence as persistence


class PersistenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.mkdtemp()
        self._prev = os.environ.get("STAXMD_CONFIG_DIR")
        os.environ["STAXMD_CONFIG_DIR"] = self._tmp
        # A fresh dir means no settings file yet.
        persistence.settings_path().unlink(missing_ok=True)

    def tearDown(self) -> None:
        if self._prev is None:
            os.environ.pop("STAXMD_CONFIG_DIR", None)
        else:
            os.environ["STAXMD_CONFIG_DIR"] = self._prev

    def test_default_settings(self) -> None:
        settings = persistence.load_settings()
        self.assertEqual(settings.theme, "light")
        self.assertEqual(settings.view_mode, "split")
        self.assertEqual(settings.recent_files, [])
        self.assertEqual(settings.session, [])

    def test_save_and_load_roundtrip(self) -> None:
        settings = persistence.Settings(
            theme="dark",
            view_mode="preview",
            geometry=[10, 20, 800, 600],
            recent_files=["/tmp/a.md"],
            session=[{"path": "/tmp/a.md", "text": "hi", "dirty": True, "label": "a.md"}],
            active_tab=0,
        )
        persistence.save_settings(settings)
        loaded = persistence.load_settings()
        self.assertEqual(loaded.theme, "dark")
        self.assertEqual(loaded.view_mode, "preview")
        self.assertEqual(loaded.geometry, [10, 20, 800, 600])
        self.assertEqual(loaded.recent_files, ["/tmp/a.md"])
        self.assertEqual(loaded.session[0]["text"], "hi")
        self.assertTrue(loaded.session[0]["dirty"])

    def test_add_recent_moves_to_front_and_dedupes(self) -> None:
        settings = persistence.add_recent_file("/a.md")
        settings = persistence.add_recent_file("/b.md", settings)
        settings = persistence.add_recent_file("/a.md", settings)
        self.assertEqual(settings.recent_files, ["/a.md", "/b.md"])

    def test_add_recent_trims_to_max(self) -> None:
        settings = persistence.Settings()
        for i in range(persistence.MAX_RECENT_FILES + 5):
            settings = persistence.add_recent_file(f"/file{i}.md", settings)
        self.assertEqual(len(settings.recent_files), persistence.MAX_RECENT_FILES)
        # Most recently added file ends up first.
        self.assertEqual(settings.recent_files[0], "/file16.md")

    def test_clear_recent(self) -> None:
        settings = persistence.add_recent_file("/a.md")
        self.assertTrue(settings.recent_files)
        settings = persistence.clear_recent_files(settings)
        self.assertEqual(settings.recent_files, [])

    def test_config_dir_created(self) -> None:
        cfg = persistence.app_config_dir()
        self.assertTrue(cfg.exists())
        self.assertTrue(cfg.is_dir())

    def test_settings_file_is_valid_json(self) -> None:
        persistence.save_settings(persistence.Settings(theme="dark"))
        data = json.loads(persistence.settings_path().read_text(encoding="utf-8"))
        self.assertEqual(data["theme"], "dark")


if __name__ == "__main__":
    unittest.main()
