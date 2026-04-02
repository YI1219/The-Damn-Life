from src.main import main


def test_main_runs(capsys):
    main()
    captured = capsys.readouterr()
    assert "runtime-py started" in captured.out
