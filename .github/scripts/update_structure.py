import os

EXCLUDE = {'.git', '.github', '__pycache__', 'node_modules', 'venv'}

def get_repo_structure(path='.', prefix=''):
    structure = []
    try:
        items = sorted(os.listdir(path))
    except FileNotFoundError:
        return structure

    items = [i for i in items if not i.startswith('.') and i not in EXCLUDE]

    for i, item in enumerate(items):
        item_path = os.path.join(path, item)
        is_last = i == len(items) - 1
        connector = '└── ' if is_last else '├── '

        if os.path.isdir(item_path):
            structure.append(f"{prefix}{connector}{item}/")
            next_prefix = prefix + ('    ' if is_last else '│   ')
            structure.extend(get_repo_structure(item_path, next_prefix))
        else:
            structure.append(f"{prefix}{connector}{item}")

    return structure

def main():
    os.makedirs("docs", exist_ok=True)
    structure = get_repo_structure()
    with open("docs/structure.txt", "w") as f:
        f.write("\n".join(structure))

if __name__ == "__main__":
    main()
