from IPython.nbformat.current import reads
from IPython.utils.text import strip_ansi


def flatten(ipynb):
    nb = reads(ipynb, "ipynb")
    content = []
    index = []
    for cell in nb.worksheets[0].cells:
        try:
            n = cell.prompt_number
        except AttributeError:
            n = "-"
        index.append("***in " + str(n))
        content.append("***in")
        if cell.cell_type == 'code':
            source = cell.input
        else:
            source = cell.source
        content.append(source)

        if cell.cell_type == 'code':
            if cell.outputs:
                index.append("***out " + str(n))
                content.append("***out")
                for output in cell.outputs:
                    if 'text' in output:
                        content.append(strip_ansi(output.text))
                    elif 'traceback' in output:
                        content.append(strip_ansi('\n'.join(output.traceback)))
                    else:
                        content.append("(Non-plaintext output)")
    return content, index


def prepare(raw_diff):
    pos_diff = [i[1:] for i in raw_diff[5:-1] if not i.startswith("-")]
    pos_flat, i_p = flatten("".join(pos_diff))
    neg_diff = [i[1:] for i in raw_diff[5:-1] if not i.startswith("+")]
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
    str_d = "\n".join(d)

    return str_d

print("done")
