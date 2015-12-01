from nbformat.v4 import reads_json
from IPython.utils.text import strip_ansi


placeholder = "(Non-plaintext output)"

def flatten(ipynb):
    nb = reads_json(ipynb)
    content = []
    index = []
    for cell in nb.cells:
        try:
            n = cell.execution_count
        except AttributeError:
            n = "-"
        if n is None:
            n = "@"
        index.append("***in " + str(n))
        content.append("***in")
        content.append(cell.source)

        if cell.cell_type == 'code':
            if cell.outputs:
                index.append("***out " + str(n))
                content.append("***out")
                for output in cell.outputs:
                    if 'text' in output:
                        content.append(strip_ansi(output.text))
                    elif 'data' in output:
                        if 'text/plain' in output.data:
                            raw_text = output.data['text/plain']

                            if raw_text.endswith(' object>'):
                                # For example, "<IPython.core.display.HTML object>"
                                content.append(placeholder)
                            else:
                                content.append(strip_ansi(raw_text))
                        else:
                            content.append(placeholder)
                    elif 'traceback' in output:
                        content.append(strip_ansi('\n'.join(output.traceback)))
                    else:
                        content.append(placeholder)
    return content, index


def prepare(raw_diff):
    pos_diff = [i[1:] for i in raw_diff[5:] if not i.startswith("-")]
    pos_flat, i_p = flatten("".join(pos_diff))
    neg_diff = [i[1:] for i in raw_diff[5:] if not i.startswith("+")]
    neg_flat, i_n = flatten("".join(neg_diff))

    return pos_flat, i_p, neg_flat, i_n


def unnest(flattened):
    splitted = [i.split("\n") for i in flattened]
    unnested = [item for sublist in splitted for item in sublist]

    return unnested


def diff(raw_diff):
    import difflib

    if raw_diff == []:
        return ""

    _pos, _i_p, _neg, _i_n = prepare(raw_diff)
    _i = _i_p + _i_n[len(_i_p):]
    pos = unnest(_pos)
    neg = unnest(_neg)

    _diff = difflib.ndiff(neg, pos)

    d = list(_diff)

    in_out = ("  ***in", "+ ***in", "- ***in", "  ***out", "+ ***out", "- ***out")
    j = 0
    for i, line in enumerate(d):
        if line.startswith(in_out):
            d[i] = _i[j]
            j += 1
    str_d = str("\n".join(d))

    return str_d

print("done")
