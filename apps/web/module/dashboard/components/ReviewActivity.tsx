import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReviewActivity({
  data,
  isLoading,
}: {
  data:
    | Array<{
        name: string;
        commits?: number;
        prs?: number;
        reviews?: number;
      }>
    | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Review activity</CardTitle>
        <CardDescription>
          Pull requests and AI reviews over the last six months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : data?.length ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/60"
                />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="prs"
                  name="Pull requests"
                  fill="#8b5cf6"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="reviews"
                  name="AI reviews"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No activity data yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
