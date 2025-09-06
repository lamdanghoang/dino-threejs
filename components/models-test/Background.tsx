import Cloud from "./Cloud";
import Crap from "./Crap";

export default function Background({
    started = false,
    direction = -1,
}: {
    started?: boolean;
    direction?: 1 | -1;
}) {
    const clouds = Array.from({ length: 8 });
    const craps = Array.from({ length: 15 });

    return (
        <>
            {clouds.map((_, i) => (
                <Cloud
                    key={`cloud-${i}`}
                    direction={direction}
                    started={started}
                />
            ))}
            {craps.map((_, i) => (
                <Crap
                    key={`crap-${i}`}
                    direction={direction}
                    started={started}
                />
            ))}
        </>
    );
}
